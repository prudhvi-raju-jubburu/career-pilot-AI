import re
import os
import logging
from pypdf import PdfReader
from pypdf.errors import PdfReadError

logger = logging.getLogger(__name__)

class ResumeParserService:
    """Extracts, cleans, and normalizes text from PDF and DOCX resumes."""

    @classmethod
    def extract_text(cls, file_path: str) -> str:
        """Determines file type and delegates to PDF or DOCX extractor."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Resume file not found at: {file_path}")

        ext = file_path.rsplit(".", 1)[-1].lower() if "." in file_path else ""
        if ext == "pdf":
            return cls.extract_text_from_pdf(file_path)
        elif ext in ("docx", "doc"):
            return cls.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported resume file extension: .{ext}. Supported formats: PDF, DOCX")

    @classmethod
    def extract_text_from_pdf(cls, file_path: str) -> str:
        """Reads a PDF file from disk and returns clean, normalized text."""
        try:
            reader = PdfReader(file_path)
            if len(reader.pages) == 0:
                raise ValueError("The uploaded PDF has no pages.")

            extracted_pages = []
            for page in reader.pages:
                page_text = page.extract_text() or ""
                extracted_pages.append(page_text)

            full_text = "\n".join(extracted_pages)
            cleaned_text = cls.clean_extracted_text(full_text)

            if len(cleaned_text.strip()) < 20:
                raise ValueError(
                    "Could not extract sufficient text from this PDF. "
                    "If this is an image-only or scanned PDF, please upload a text-based PDF."
                )

            logger.info("Successfully extracted %d characters from PDF resume", len(cleaned_text))
            return cleaned_text

        except PdfReadError as e:
            logger.error("PdfReadError reading file %s: %s", file_path, str(e))
            raise ValueError(f"Corrupted or invalid PDF format: {str(e)}")
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            logger.error("Unexpected error parsing PDF %s: %s", file_path, str(e))
            raise ValueError(f"Failed to process PDF: {str(e)}")

    @classmethod
    def extract_text_from_docx(cls, file_path: str) -> str:
        """Reads a DOCX file using python-docx and returns clean text."""
        try:
            import docx
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        if cell.text.strip():
                            paragraphs.append(cell.text.strip())

            full_text = "\n".join(paragraphs)
            cleaned_text = cls.clean_extracted_text(full_text)
            if len(cleaned_text.strip()) < 20:
                raise ValueError("Could not extract sufficient text from DOCX resume.")
            return cleaned_text
        except Exception as e:
            logger.error("Error reading DOCX file %s: %s", file_path, str(e))
            raise ValueError(f"Failed to read DOCX resume: {str(e)}")

    @staticmethod
    def clean_extracted_text(raw_text: str) -> str:
        """Removes weird glyphs, redundant whitespace, and cleans up artifacts."""
        if not raw_text:
            return ""

        text = raw_text.replace("\u00a0", " ").replace("\r\n", "\n").replace("\r", "\n")
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]{2,}", " ", text)
        text = "".join(ch for ch in text if ch == "\n" or ch == "\t" or (32 <= ord(ch) <= 126) or ord(ch) > 127)
        return text.strip()
