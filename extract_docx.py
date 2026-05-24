import zipfile
import xml.etree.ElementTree as ET
import os

docx_path = "/Users/rafael.franca/Documents/www/commet.pro/commet_documento_tecnico_alteracao_site-2.docx"
txt_output_path = "/Users/rafael.franca/Documents/www/commet.pro/commet_doc.txt"

def extract_docx_text(path):
    if not os.path.exists(path):
        return f"File not found: {path}"
    
    try:
        with zipfile.ZipFile(path) as z:
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespaces
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            paragraphs = []
            for paragraph in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                texts = [node.text for node in paragraph.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
                if texts:
                    paragraphs.append("".join(texts))
            
            return "\n\n".join(paragraphs)
    except Exception as e:
        return f"Error: {str(e)}"

text = extract_docx_text(docx_path)
with open(txt_output_path, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Extracted {len(text)} characters to {txt_output_path}")
