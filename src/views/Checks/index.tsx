import { BusyButton } from '@genai-fi/base';
import style from './style.module.css';
import { useState } from 'react';
import { checks } from '@genai-fi/nanogpt';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

interface Result {
    name: string;
    results: { backend: string; result: unknown; error?: string; passed: boolean; maxError?: number }[];
}

export function Component() {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<Result[]>([]);

    const runChecks = async () => {
        const EPSILON = 1e-5;
        setRunning(true);
        setResults([]);
        let result = await checks.runCheck(checks.rope, EPSILON);
        setResults((prev) => [...prev, { results: result, name: 'RoPE' }]);
        result = await checks.runCheck(checks.normRMS, EPSILON);
        setResults((prev) => [...prev, { results: result, name: 'RMS Norm' }]);
        result = await checks.runCheck(checks.qkv, EPSILON);
        setResults((prev) => [...prev, { results: result, name: 'QKV' }]);
        result = await checks.runCheck(checks.gelu, EPSILON);
        setResults((prev) => [...prev, { results: result, name: 'Gelu' }]);
        result = await checks.runCheck(checks.normRMSGrad, EPSILON);
        setResults((prev) => [...prev, { results: result, name: 'RMS Norm Grad' }]);
        result = await checks.runCheck(checks.appendCache, EPSILON);
        setResults((prev) => [...prev, { results: result, name: 'Append Cache' }]);
        result = await checks.runCheck(checks.attentionMask, EPSILON);
        setResults((prev) => [...prev, { results: result, name: 'Attention Mask' }]);
        result = await checks.runCheck(checks.matMulGelu, EPSILON);
        setResults((prev) => [...prev, { results: result, name: 'MatMul Gelu' }]);
        setRunning(false);
    };

    return (
        <div className={style.column}>
            <h2>Automated Tests</h2>
            <BusyButton
                busy={running}
                variant="contained"
                color="primary"
                onClick={runChecks}
            >
                Run Checks
            </BusyButton>
            {results.length === 0 && <p>No results yet. Click "Run Checks" to start.</p>}
            <ul className={style.results}>
                {results.map((res, index) => {
                    const allPassed = res.results.every((r) => r.passed);

                    if (!allPassed) {
                        console.error(`Check "${res.name}" failed:`, res);
                    }

                    return (
                        <li
                            key={index}
                            className={style.resultItem}
                        >
                            {allPassed ? <CheckIcon color="success" /> : <CloseIcon color="error" />}
                            <div className={style.resultContent}>
                                <h3>
                                    {res.name} - {allPassed ? 'Passed' : 'Failed'}
                                </h3>
                                {res.results.some((r) => r.error) && (
                                    <p className={style.error}>Error: {res.results.find((r) => r.error)?.error}</p>
                                )}
                                {!allPassed && (
                                    <div className={style.individualResults}>
                                        {res.results.map((r, i) => (
                                            <div
                                                key={i}
                                                className={r.passed ? style.passed : style.failed}
                                            >
                                                {r.backend}: {r.passed ? 'Passed' : 'Failed'} ({r.maxError || 0})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
