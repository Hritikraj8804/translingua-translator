import sys
import os

# Adds the backend directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import load_model

if __name__ == "__main__":
    print("---------------------------------------------------------")
    print("Translingua AI - Offline Model Pre-Fetch Utility")
    print("---------------------------------------------------------")
    print("Downloading Meta's NLLB-200-Distilled-600M (~2.4GB)...")
    print("This requires an internet connection and will take some time.")
    print("Once complete, your translator will operate 100% offline at production quality.")
    
    # Trigger the HuggingFace download mechanism manually
    load_model()
    
    print("\n---------------------------------------------------------")
    print("SUCCESS! The ultra-high quality NLLB model is now cached.")
    print("You may now run the translator completely offline.")
    print("---------------------------------------------------------")
