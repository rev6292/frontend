import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { RawInvoiceItem } from "../types"; // RawInvoiceItemをインポート

// APIキーは環境変数から直接利用します。
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * 商品名とカテゴリに基づいて商品説明文を生成します。
 * @param productName 商品名
 * @param category カテゴリ名 (文字列)
 * @returns 生成された商品説明文の文字列
 */
export const generateProductDescription = async (productName: string, category: string): Promise<string> => {
  if (!process.env.API_KEY) {
     throw new Error("Gemini APIキーが設定されていません。商品説明文を生成できません。");
  }
  try {
    const prompt = `あなたはプロのコピーライターです。以下の情報に基づいて、美容室で使用される製品の魅力的で簡潔な商品説明文を作成してください。顧客が購入したくなるような、製品の主な特徴や利点を強調してください。

商品名: ${productName}
カテゴリ: ${category}

説明文は日本語で、120文字以内でお願いします。`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const text = response.text;
    if (text) {
      return text.trim();
    } else {
      throw new Error("APIから有効なテキスト応答がありませんでした。");
    }
  } catch (error) {
    console.error("Gemini API呼び出し中にエラーが発生しました (generateProductDescription):", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("無効なAPIキーです。設定を確認してください。");
        }
         throw new Error(`商品説明文の生成に失敗しました: ${error.message}`);
    }
    throw new Error("商品説明文の生成中に不明なエラーが発生しました。");
  }
};

const invoiceSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            itemName: {
                type: Type.STRING,
                description: 'The name of the item on the invoice.',
            },
            quantity: {
                type: Type.STRING,
                description: 'The quantity of the item.',
            },
            unitPrice: {
                type: Type.STRING,
                description: 'The price per unit. Should be a string representing a number, or not present if not found.',
            },
            totalPrice: {
                type: Type.STRING,
                description: 'The total price for the item. Should be a string representing a number, or not present if not found.',
            },
        },
        required: ['itemName', 'quantity'],
    }
};


/**
 * 納品書画像から商品リストを抽出します。
 * @param imageBase64Base64エンコードされた画像データ
 * @returns 抽出された商品情報の配列 (RawInvoiceItem[])
 */
export const parseInvoiceImage = async (imageBase64: string): Promise<RawInvoiceItem[]> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini APIキーが設定されていません。納品書を解析できません。");
  }

  let originalResponseTextForError = "";

  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    };
    const textPart = {
      text: `提供された納品書の画像を解析し、記載されている各商品を抽出してください。
項目には、商品名、数量、そして可能であれば単価や合計金額を含めてください。
重要:
- 金額（単価、合計金額）は、円記号(¥)や数字が明確に記載されている場合のみ抽出してください。重量(g)や容量(ml)などのサイズ情報は金額として扱わないでください。
- レスポンスは指示されたJSON形式のみを返してください。`,
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [imagePart, textPart] },
      config: {
          responseMimeType: "application/json",
          responseSchema: invoiceSchema,
      },
    });
    
    originalResponseTextForError = response.text.trim();
    
    try {
      const parsedData = JSON.parse(originalResponseTextForError);
      if (Array.isArray(parsedData)) {
        const cleanedData = parsedData
          .filter(item => item && typeof item.itemName === 'string' && item.itemName.trim() !== '' && (typeof item.quantity === 'string' || typeof item.quantity === 'number'))
          .map((item: { itemName: string; quantity: string | number; [key: string]: any }) => {
            let cleanedName = item.itemName.trim();
            // Sometimes AI includes the quantity in the name like "Product X x10", remove it.
            cleanedName = cleanedName.replace(/[×ｘ][0-9０-９]+$/, '').trim();
            return {
              ...item,
              itemName: cleanedName,
              quantity: String(item.quantity), // Ensure quantity is a string as per RawInvoiceItem
            };
          });
        return cleanedData as RawInvoiceItem[];
      } else {
        throw new Error("APIからの応答が期待される配列形式ではありませんでした。");
      }
    } catch (e) {
      console.error("API応答のJSONパースに失敗しました:", originalResponseTextForError, e);
      throw new Error(`API応答のJSONパースに失敗しました。応答内容: ${originalResponseTextForError.substring(0,200)}...`);
    }

  } catch (error) {
    console.error("Gemini API呼び出し中にエラーが発生しました (parseInvoiceImage):", error);
    if (error instanceof Error) {
      if (error.message.includes("API key not valid")) {
        throw new Error("無効なAPIキーです。設定を確認してください。");
      }
      if (error.message.includes("API応答のJSONパースに失敗しました")) {
        throw error; // Re-throw the specific parsing error
      }
      throw new Error(`納品書の解析に失敗しました: ${error.message}`);
    }
    throw new Error("納品書の解析中に不明なエラーが発生しました。");
  }
};