function clamp01(v: number): number {
    return Math.min(1, Math.max(0, v));
}

function normLog2(value: number, minPow: number, maxPow: number): number {
    const safe = Math.max(1, value);
    const p = Math.log2(safe);
    return clamp01((p - minPow) / (maxPow - minPow));
}

async function getBatteryChargingStatus(): Promise<boolean | null> {
    if ('getBattery' in navigator) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const battery = await (navigator as any).getBattery();
            return battery.charging;
        } catch {
            return null;
        }
    }
    return null;
}

function getUADataMobile(): boolean {
    const navAny = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
    return !!navAny.userAgentData?.mobile;
}

export async function estimateFullTrainingPowerWatts(adapter?: GPUAdapter): Promise<number> {
    const info = adapter?.info;
    const limits = adapter?.limits;
    const vendor = (info?.vendor || '').toLowerCase();
    const arch = (info?.architecture || '').toLowerCase();
    const desc = `${vendor} ${arch}`.trim();

    // Capability score from limits (0..1)
    const invocationsScore = limits ? clamp01((limits.maxComputeInvocationsPerWorkgroup - 128) / (1024 - 128)) : 0;
    const workgroupMemScore = limits ? clamp01((limits.maxComputeWorkgroupStorageSize - 16384) / (65536 - 16384)) : 0;
    const storageBufferScore = limits ? normLog2(limits.maxStorageBufferBindingSize, 26, 33) : 0; // 64 MiB..8 GiB
    const bufferSizeScore = limits ? normLog2(limits.maxBufferSize, 28, 35) : 0; // 256 MiB..32 GiB

    const capabilityScore =
        0.35 * invocationsScore + 0.2 * workgroupMemScore + 0.2 * storageBufferScore + 0.25 * bufferSizeScore;

    // Classify rough hardware tier
    const isNvidia = desc.includes('nvidia');
    const isAmd = desc.includes('amd') || desc.includes('advanced micro devices') || desc.includes('radeon');
    const isIntel = desc.includes('intel');
    const isApple = desc.includes('apple');
    const isMobileVendor =
        desc.includes('qualcomm') ||
        desc.includes('adreno') ||
        desc.includes('arm') ||
        desc.includes('mali') ||
        desc.includes('imagination') ||
        desc.includes('powervr');

    const isKnownMobile = getUADataMobile();
    const batteryCharging = await getBatteryChargingStatus();

    const likelyDiscrete =
        (isNvidia || isAmd) &&
        (limits?.maxBufferSize || 0) >= 2 * 1024 * 1024 * 1024 &&
        (limits?.maxStorageBufferBindingSize || 0) >= 512 * 1024 * 1024;

    const likelyPortable =
        isKnownMobile ||
        batteryCharging !== null ||
        isApple ||
        isMobileVendor ||
        (isIntel && (limits?.maxBufferSize || 0) <= 2 * 1024 * 1024 * 1024);

    const isDesktop = !isKnownMobile && batteryCharging === null && !isApple && !isMobileVendor;

    let baseWatts = 20;

    if (isDesktop) {
        if (isNvidia || isAmd) {
            // High-end discrete GPU
            baseWatts = 150 + capabilityScore * 150; // 150W..300W
        } else if (isIntel) {
            // Integrated Intel desktop GPU
            baseWatts = 20 + capabilityScore * 30; // 20W..50W
        } else {
            // Unknown desktop GPU
            baseWatts = 50 + capabilityScore * 100; // 50W..150W
        }
    } else if (isKnownMobile || isMobileVendor) {
        baseWatts = 5 + capabilityScore * 20; // 5W..25W
    } else if (likelyPortable) {
        // Laptop or unknown portable/desktop
        if (likelyDiscrete) {
            baseWatts = 30 + capabilityScore * 50; // 30W..80W
        } else {
            baseWatts = 10 + capabilityScore * 20; // 10W..30W
        }
    } else {
        // Unknown/uncategorized
        baseWatts = 20 + capabilityScore * 40; // 20W..60W
    }

    if (batteryCharging === false) {
        baseWatts *= 0.7;
    }

    return Math.floor(baseWatts);
}

export function estimateEnergyKWh(powerWatts: number, trainingHours: number): number {
    return (powerWatts * trainingHours) / 1000;
}
