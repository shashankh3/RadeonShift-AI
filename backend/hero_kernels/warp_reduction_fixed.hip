// FIXED VERSION — Wavefront-64 aware reduction for AMD MI300X

#include <hip/hip_runtime.h>

__global__ void warpReduce(int* input, int* output, int n) {
    int tid = threadIdx.x;
    int localSum = 0;

    // FIX: Use runtime warpSize query instead of hardcoded 32
    int lane = tid % warpSize;
    int warpId = tid / warpSize;

    if (tid < n) {
        localSum = input[tid];
    }

    // Adaptive reduction — works for both 32 and 64-lane wavefronts
    for (int offset = warpSize / 2; offset > 0; offset >>= 1) {
        localSum += __shfl_down_sync(0xFFFFFFFFFFFFFFFF, localSum, offset);
    }

    if (lane == 0) {
        output[warpId] = localSum;
    }
}

int main() {
    int n = 1024;
    int* d_input;
    int* d_output;
    hipMalloc(&d_input, n * sizeof(int));
    hipMalloc(&d_output, (n / warpSize) * sizeof(int));

    int* h_input = new int[n];
    for (int i = 0; i < n; i++) h_input[i] = 1;

    hipMemcpy(d_input, h_input, n * sizeof(int), hipMemcpyHostToDevice);

    // Time the kernel
    hipEvent_t start, stop;
    hipEventCreate(&start);
    hipEventCreate(&stop);
    hipEventRecord(start);

    hipLaunchKernelGGL(warpReduce, dim3(1), dim3(n), 0, 0, d_input, d_output, n);

    hipEventRecord(stop);
    hipEventSynchronize(stop);

    float elapsed_ms = 0;
    hipEventElapsedTime(&elapsed_ms, start, stop);

    hipDeviceSynchronize();

    int* h_output = new int[n / warpSize];
    hipMemcpy(h_output, d_output, (n / warpSize) * sizeof(int), hipMemcpyDeviceToHost);

    // Calculate throughput
    long bytes_processed = (long)n * sizeof(int) * 2; // read + write
    double elapsed_seconds = elapsed_ms / 1000.0;
    double throughput_gbps = (bytes_processed / elapsed_seconds) / 1e9;

    // Verify correctness
    // On wavefront-64: each wavefront has 64 threads, so n/warpSize = 16 warps, each summing 64
    int expected_per_warp = warpSize;
    int correctness_pass = 1;
    int num_warps = n / warpSize;
    for (int i = 0; i < num_warps; i++) {
        if (h_output[i] != expected_per_warp) {
            correctness_pass = 0;
            break;
        }
    }

    printf("{\"kernel\": \"warp_reduction\", \"elements\": %d, \"elapsed_ms\": %.6f, \"throughput_gbps\": %.1f, \"correctness_pass\": %d, \"warpSize\": %d}\n",
           n, elapsed_ms, throughput_gbps, correctness_pass, warpSize);

    hipFree(d_input);
    hipFree(d_output);
    delete[] h_input;
    delete[] h_output;
    return 0;
}
