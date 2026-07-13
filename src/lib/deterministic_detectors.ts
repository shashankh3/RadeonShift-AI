export interface PortabilityRisk {
  pattern_name: string;
  line_number: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
}

export function detect_amd_portability_risks(cuda_source_code: string): PortabilityRisk[] {
  const findings: PortabilityRisk[] = [];
  const lines = cuda_source_code.split('\n');
  let in_block_comment = false;

  for (let i = 0; i < lines.length; i++) {
    const line_number = i + 1;
    let line = lines[i];

    // Handle block comments
    if (line.includes('/*') && line.includes('*/')) {
      line = line.replace(/\/\*.*?\*\//g, '');
    } else if (line.includes('/*')) {
      in_block_comment = true;
      line = line.split('/*')[0];
    } else if (line.includes('*/')) {
      in_block_comment = false;
      line = line.split('*/')[1];
    }

    if (in_block_comment) continue;

    // Handle line comments
    if (line.includes('//')) {
      line = line.split('//')[0];
    }

    // Skip strings (simplistic)
    line = line.replace(/"[^"]*"/g, '""');
    line = line.replace(/'[^']*'/g, "''");

    const lower_line = line.toLowerCase();

    // % 32
    if (/% \s*32\b/.test(line) || /%\s*32\b/.test(line)) {
      findings.push({
        pattern_name: '% 32',
        line_number,
        severity: 'CRITICAL',
        description: 'Hardcoded warp-size-32 assumption. AMD GPUs use wavefront-64. This will cause incorrect results.',
      });
    }

    // / 32
    if (/\/\s*32\b/.test(line)) {
      findings.push({
        pattern_name: '/ 32',
        line_number,
        severity: 'CRITICAL',
        description: 'Hardcoded warp-size-32 division. AMD uses wavefront-64.',
      });
    }

    // __shfl
    if (lower_line.includes('__shfl')) {
      findings.push({
        pattern_name: '__shfl',
        line_number,
        severity: 'HIGH',
        description: 'Warp shuffle operation. Semantics differ between NVIDIA warp (32) and AMD wavefront (64).',
      });
    }

    // wmma
    if (lower_line.includes('wmma')) {
      findings.push({
        pattern_name: 'wmma',
        line_number,
        severity: 'HIGH',
        description: 'Warp Matrix Multiply-Accumulate. No direct HIP equivalent. Manual redesign required.',
      });
    }

    // mma.h
    if (lower_line.includes('mma.h')) {
      findings.push({
        pattern_name: 'mma.h',
        line_number,
        severity: 'HIGH',
        description: 'Matrix multiply-accumulate header. NVIDIA-specific. Requires manual translation.',
      });
    }

    // cuda::memcpy_async or __pipeline_memcpy_async
    if (lower_line.includes('cuda::memcpy_async') || lower_line.includes('__pipeline_memcpy_async')) {
      findings.push({
        pattern_name: 'memcpy_async',
        line_number,
        severity: 'HIGH',
        description: 'Async memory copy API. Differs on AMD. Needs manual adaptation.',
      });
    }

    // cooperative_groups
    if (lower_line.includes('cooperative_groups')) {
      findings.push({
        pattern_name: 'cooperative_groups',
        line_number,
        severity: 'MEDIUM',
        description: 'Cooperative groups API. Partial AMD support. Requires review.',
      });
    }

    // asm( or inline PTX
    if (lower_line.includes('asm(') || lower_line.includes('__asm__') || lower_line.includes('asm (')) {
      findings.push({
        pattern_name: 'asm',
        line_number,
        severity: 'MEDIUM',
        description: 'Inline PTX assembly. PTX is NVIDIA-specific. Requires manual rewrite.',
      });
    }
  }

  return findings;
}
