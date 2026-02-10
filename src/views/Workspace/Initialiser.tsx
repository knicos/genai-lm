import { useCallback, useEffect, useRef } from 'react';
import { MANIFEST_URL } from '../../components/ModelSearch/ModelSearch';
import { TeachableLLM } from '@genai-fi/nanogpt';
import { useAtom } from 'jotai';
import { modelAtom } from '../../state/model';
import waitModelLoaded from '../../utilities/waitModelLoaded';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ModelManifest } from '../../components/ModelSearch/manifest';

export default function Initialiser() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [model, setModel] = useAtom(modelAtom);
    // Prevent double loading issues
    const modelRef = useRef<TeachableLLM | undefined>(model);
    modelRef.current = model;
    const loadModelById = useCallback(
        (id: string) => {
            console.log('Loading model by id:', id);
            fetch(MANIFEST_URL)
                .then((res) => res.json())
                .then((data: ModelManifest) => {
                    const card = data.models.find((m) => m.id === id);
                    if (!card) {
                        console.error('Model not found in manifest:', id);
                        return;
                    }

                    if (!card.url) {
                        if (modelRef.current) {
                            return;
                        }
                        const newModel = TeachableLLM.create(card.tokeniser || 'char', card.config);
                        modelRef.current = newModel;
                        newModel.meta.id = card.id;
                        newModel.meta.name = t('model.defaultName');
                        newModel.meta.trained = false;

                        waitModelLoaded(newModel)
                            .then(() => {
                                setModel(newModel);
                            })
                            .catch((e) => {
                                console.error('Failed to wait for model', e);
                            });
                    } else {
                        fetch(card.url)
                            .then((res) => res.blob())
                            .then((blob) => {
                                if (modelRef.current) {
                                    //modelRef.current.dispose();

                                    return;
                                }
                                const file = new File([blob], `${card.id}.zip`, { type: 'application/zip' });
                                const newModel = TeachableLLM.loadModel(file, { sourceURL: card.url });
                                modelRef.current = newModel;
                                newModel.meta.id = card.id;
                                newModel.meta.name = card.name;
                                newModel.meta.trained = card.trained || true;

                                waitModelLoaded(newModel)
                                    .then(() => {
                                        setModel(newModel);
                                    })
                                    .catch((e) => {
                                        console.error('Failed to wait for model', e);
                                    });
                            })
                            .catch((e) => {
                                console.error('Failed to fetch model file', e);
                            });
                    }
                })
                .catch((e) => {
                    console.error('Failed to load model manifest', e);
                });
        },
        [setModel, t]
    );

    const modelParam = searchParams.get('model');

    useEffect(() => {
        // Use provided model id from URL params
        if (modelParam) {
            loadModelById(modelParam);
            // Load untrained model for pretrain workflow
        } else {
            loadModelById('untrained-small');
        }
    }, [modelParam, loadModelById]);
    return null;
}
