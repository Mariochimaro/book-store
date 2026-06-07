from difflib import SequenceMatcher
import re

def lat_to_geo(text: str) -> str:
    #ორ-ასოიანი ბგერების ჩანაცვლება
    digraphs = {
        "ch": "ჩ", "sh": "შ", "zh": "ჟ", "ts": "ც", "dz": "ძ", "kh": "ხ",
        "gh": "ღ", "ph": "ფ", "th": "თ", "tc": "ც"
    }
    for eng, geo in digraphs.items():
        text = text.replace(eng, geo)
        
    #ერთ-ასოიანი ბგერების ჩანაცვლება
    chars = {
        'a': 'ა', 'b': 'ბ', 'g': 'გ', 'd': 'დ', 'e': 'ე', 'v': 'ვ',
        'z': 'ზ', 't': 'ტ', 'i': 'ი', 'k': 'კ', 'l': 'ლ', 'm': 'მ',
        'n': 'ნ', 'o': 'ო', 'p': 'პ', 'j': 'ჯ', 'r': 'რ', 's': 'ს',
        'u': 'უ', 'f': 'ფ', 'q': 'ქ', 'y': 'ყ', 'c': 'ც', 'w': 'წ', 'x': 'ხ', 'h': 'ჰ'
    }
    for eng, geo in chars.items():
        text = text.replace(eng, geo)
        
    return text

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", str(text).lower().strip())

def search_match(query: str, value: str, threshold: float = 0.45) -> bool:
    if not query or not value:
        return False
        
    query = normalize(query)
    value = normalize(value)

    if query in value or SequenceMatcher(None, query, value).ratio() >= threshold:
        return True
        
    #bechdebis -> ბეჩდების
    geo_query = lat_to_geo(query)
    if geo_query != query:
        if geo_query in value or SequenceMatcher(None, geo_query, value).ratio() >= threshold:
            return True

    return False