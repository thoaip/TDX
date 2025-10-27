import { GoogleGenAI, Modality } from "@google/genai";

export async function editImageWithPrompt(
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (
      response.candidates &&
      response.candidates.length > 0 &&
      response.candidates[0].content &&
      response.candidates[0].content.parts
    ) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error("Không tìm thấy dữ liệu hình ảnh trong phản hồi của API.");
  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    throw new Error("Chỉnh sửa ảnh thất bại. Vui lòng kiểm tra console để biết chi tiết.");
  }
}

export async function generateVideoWithPrompt(
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  image?: { base64: string; mimeType: string; }
): Promise<string> {
    // Veo yêu cầu tạo một instance mới để lấy API key mới nhất
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p', // Sử dụng 720p để tạo nhanh hơn
            aspectRatio: aspectRatio
        }
    };
    if (image) {
        payload.image = {
            imageBytes: image.base64,
            mimeType: image.mimeType
        };
    }

    try {
        let operation = await ai.models.generateVideos(payload);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Thăm dò mỗi 10 giây
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Tạo video thành công nhưng không tìm thấy liên kết tải xuống.");
        }

        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Tải video đã tạo thất bại. Trạng thái: ${videoResponse.status}`);
        }

        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Lỗi khi gọi Veo API:", error);
        if (error instanceof Error && error.message.includes("Requested entity was not found")) {
            throw new Error("API Key không hợp lệ hoặc đã hết hạn. Vui lòng chọn lại API Key.");
        }
        throw new Error("Tạo video thất bại. Vui lòng kiểm tra console để biết chi tiết.");
    }
}