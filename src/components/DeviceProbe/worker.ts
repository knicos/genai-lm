// worker.ts - WebGPU Memory Probe Worker
const state = {
    block: false,
};

self.onmessage = async (e: MessageEvent) => {
    if (e.data.type === 'probe') {
        if (state.block) return;
        state.block = true;
        await probeGPUMemory();
    }
};

async function probeGPUMemory(adapterType: 'high-performance' | 'low-power' = 'high-performance') {
    try {
        const adapter = await navigator.gpu?.requestAdapter({
            powerPreference: adapterType,
        });

        if (!adapter) {
            self.postMessage({ type: 'error', message: 'WebGPU adapter not available' });
            self.postMessage({ type: 'complete', maxMemory: 0 });
            return;
        }

        const device = await adapter.requestDevice();

        const buffers: GPUBuffer[] = [];
        const chunkSize = 64 * 1024 * 1024; // 64 MB chunks
        let totalAllocated = 0;
        let failed = false;

        // Create a simple compute shader that writes to the buffer
        const shaderModule = device.createShaderModule({
            code: `
        @group(0) @binding(0) var<storage, read_write> data: array<u32>;
        
        @compute @workgroup_size(256)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
          let index = global_id.x;
          if (index < arrayLength(&data)) {
            data[index] = index;
          }
        }
      `,
        });

        const pipeline = device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: shaderModule,
                entryPoint: 'main',
            },
        });

        device.addEventListener('uncapturederror', () => {
            failed = true;
        });

        self.postMessage({ type: 'start', chunkSize });

        while (!failed) {
            // Create storage buffer
            const buffer = device.createBuffer({
                size: chunkSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });

            // Create bind group
            const bindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: { buffer },
                    },
                ],
            });

            // Submit a compute pass to actually use the memory
            const commandEncoder = device.createCommandEncoder();
            const passEncoder = commandEncoder.beginComputePass();
            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, bindGroup);
            const workgroups = 32 * 1024;
            passEncoder.dispatchWorkgroups(workgroups);
            passEncoder.end();

            device.queue.submit([commandEncoder.finish()]);

            // Wait for GPU operations to complete
            await device.queue.onSubmittedWorkDone();

            // Check for errors after GPU work
            await new Promise((resolve) => setTimeout(resolve, 10));

            if (failed) {
                buffer.destroy();
                break;
            }

            buffers.push(buffer);
            totalAllocated += chunkSize;

            self.postMessage({
                type: 'progress',
                allocated: totalAllocated,
            });

            // Small delay between allocations
            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        self.postMessage({
            type: 'complete',
            maxMemory: totalAllocated,
        });

        buffers.forEach((buf) => buf.destroy());
        device.destroy();
    } catch (error) {
        self.postMessage({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        self.postMessage({ type: 'complete', maxMemory: 0 });
    }
}
