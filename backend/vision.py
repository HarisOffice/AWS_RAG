from groq import Groq
import base64
import os
from dotenv import load_dotenv
from typing import List, Dict
import json
from pathlib import Path
from tqdm import tqdm

class ExactTextExtractor:
    def __init__(self, api_key: str):
        """Initialize the extractor with Groq API key"""
        self.client = Groq(api_key=api_key)

    def encode_image(self, image_path: str) -> str:
        """Encode image to base64"""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def extract_text(self, image_path: str) -> Dict:
        """Extract text from image maintaining exact format"""
        try:
            base64_image = self.encode_image(image_path)
            
            # Specific prompt to maintain exact formatting
            prompt = """
            Extract ALL text from this image EXACTLY as it appears, maintaining:
            - Original line breaks
            - Exact question numbering
            - Multiple choice options with their letters
            - Bullet points if present
            - Indentation
            - Any special characters or symbols
            
            Do not add any descriptions or explanations. Output the text exactly as it appears in the image.
            """

            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                model="llama-3.2-90b-vision-preview",
                temperature=0.1  # Lower temperature for more exact reproduction
            )

            return {
                "image_path": image_path,
                "text": chat_completion.choices[0].message.content.strip(),
                "status": "success"
            }
        except Exception as e:
            return {
                "image_path": image_path,
                "text": str(e),
                "status": "error"
            }

    def process_multiple_images(self, image_paths: List[str], output_file: str = None) -> List[Dict]:
        """Process multiple images and maintain their exact text format"""
        results = []
        
        for image_path in tqdm(image_paths, desc="Processing images"):
            result = self.extract_text(image_path)
            results.append(result)

        if output_file:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)

        return results

def main():
    # Load environment variables
    load_dotenv()
    
    # Get API key
    api_key = os.getenv("GROQ_API_KEY2")
    if not api_key:
        raise ValueError("API key not found in .env file")

    # Initialize extractor
    extractor = ExactTextExtractor(api_key)

    # Example image paths
    image_paths = [
        r"C:\\Users\\as\\Downloads\\PXL_35.jpg",
        r"C:\\Users\\as\\Downloads\\PXL_36.jpg"
    ]

    # Process images
    results = extractor.process_multiple_images(
        image_paths,
        output_file="extracted_text_exact.json"
    )

    # Print results
    for result in results:
        print(f"\nFile: {Path(result['image_path']).name}")
        print("-" * 50)
        print(result['text'])
        print("-" * 50)

if __name__ == "__main__":
    main()