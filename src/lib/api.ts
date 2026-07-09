export interface TranslationResponse {
  rocm_code: string;
  audit_log: string;
}

export async function translateCode(code: string): Promise<TranslationResponse> {
  const response = await fetch('http://localhost:8000/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cuda_code: code }),
  });

  if (!response.ok) {
    throw new Error(`Translation failed with status: ${response.status}`);
  }

  const data = await response.json();
  
  // Basic validation to ensure the response matches the expected format
  if (!data.rocm_code || !data.audit_log) {
      throw new Error("Invalid response format from server.");
  }

  return data as TranslationResponse;
}
