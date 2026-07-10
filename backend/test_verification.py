import sys
import os
sys.path.append(os.path.abspath('.'))

from main import perform_static_portability_scan, attempt_hip_compile

def test_static_scan():
    cuda_code = """
    __global__ void test() {
        int w = warpSize;
        asm("v.add");
        cublasCreate();
    }
    """
    hip_code = """
    __global__ void test() {
        int w = warpSize;
        asm("v.add");
        cublasCreate();
        cudaMalloc();
        <<< >>>
    }
    """
    
    result = perform_static_portability_scan(hip_code, cuda_code)
    assert result["ptx_blocks"] == 1, f"Expected 1 PTX, got {result['ptx_blocks']}"
    assert result["warp32_assumptions"] == 1
    assert "cublas" in result["cuda_library_dependencies"]
    assert "cudaMalloc" in result["cuda_api_remnants"]
    assert result["manual_review_required"] == True
    print("Static scan tests passed.")
    
def test_compile_mock():
    # Because we might not have hipcc, just check it handles the lack of hipcc gracefully
    result = attempt_hip_compile("int main() { return 0; }")
    print("Compile test result:", result)
    
if __name__ == "__main__":
    test_static_scan()
    test_compile_mock()
