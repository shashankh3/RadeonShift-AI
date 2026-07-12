// WARP REDUCTION KERNEL — Contains intentional warpSize=32 hardcode
// This kernel will compile on AMD but silently produce wrong results
// on wavefront-64 architecture (MI300X gfx942)

#include <cuda_runtime.h>

__global__ void warpReduce(int* input, int* output, int n) {
    int tid = threadIdx.x;
    int localSum = 0;

    // BUG: Hardcoded 32-lane assumption
    // Correct on NVIDIA (warpSize=32)
    // Wrong on AMD (warpSize=64 on gfx942)
    int lane = tid % 32;
    int warpId = tid / 32;

    if (tid < n) {
        localSum = input[tid];
    }

    // Warp shuffle reduction — assumes 32 lanes
    for (int offset = 16; offset > 0; offset >>= 1) {
        localSum += __shfl_down_sync(0xFFFFFFFF, localSum, offset);
    }

    if (lane == 0) {
        output[warpId] = localSum;
    }
}

int main() {
    int n = 1024;
    int* d_input;
    int* d_output;
    cudaMalloc(&d_input, n * sizeof(int));
    cudaMalloc(&d_output, (n / 32) * sizeof(int));

    // Simple test data
    int* h_input = new int[n];
    for (int i = 0; i < n; i++) h_input[i] = 1;

    cudaMemcpy(d_input, h_input, n * sizeof(int), cudaMemcpyHostToDevice);
    warpReduce<<<1, n>>>(d_input, d_output, n);
    cudaDeviceSynchronize();

    int* h_output = new int[n / 32];
    cudaMemcpy(h_output, d_output, (n / 32) * sizeof(int), cudaMemcpyDeviceToHost);

    // Print results as JSON for parsing
    printf("{\"kernel\": \"warp_reduction\", \"elements\": %d, \"warps\": %d}\n", n, n / 32);

    cudaFree(d_input);
    cudaFree(d_output);
    delete[] h_input;
    delete[] h_output;
    return 0;
}
