import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# To hold the singleton architecture of NLLB (so it only loads once)
_nlp_model = None
_nlp_tokenizer = None

# Using the unified 2.4GB NLLB model
MODEL_NAME = "facebook/nllb-200-distilled-600M"

# NLLB uses specific BCP-47 like language codes
NLLB_LANG_MAP = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "te": "tel_Telu",
    "ja": "jpn_Jpan",
    "ko": "kor_Hang"
}

def load_model():
    global _nlp_model, _nlp_tokenizer
    if _nlp_model is not None and _nlp_tokenizer is not None:
        return _nlp_tokenizer, _nlp_model
        
    logger.info(f"Loading {MODEL_NAME} into memory... This may take a minute.")
    # Initialize tokenizer and model. NLLB uses AutoTokenizer and AutoModelForSeq2SeqLM
    _nlp_tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    _nlp_model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    logger.info("NLLB Model loaded successfully!")
    
    return _nlp_tokenizer, _nlp_model

def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    # Base case: Same language
    if source_lang == target_lang:
        return text

    source_nllb_code = NLLB_LANG_MAP.get(source_lang)
    target_nllb_code = NLLB_LANG_MAP.get(target_lang)
    
    if not source_nllb_code or not target_nllb_code:
        raise ValueError(f"Language codes {source_lang} or {target_lang} are not supported.")

    try:
        tokenizer, model = load_model()
        
        # NLLB requires specifying the source language in the tokenizer
        tokenizer.src_lang = source_nllb_code
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        
        # We specify the target language token ID when generating
        target_token_id = tokenizer.convert_tokens_to_ids(target_nllb_code)
        
        translated_tokens = model.generate(
            **inputs, 
            forced_bos_token_id=target_token_id,
            max_length=512
        )
        
        translated_text = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)
        return translated_text
        
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise e
