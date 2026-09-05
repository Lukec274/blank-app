"""Age of Ashlands — serves the game inside Streamlit.

The game itself is a single self-contained HTML file (game/index.html) with no
external assets: every texture and sprite is generated procedurally at runtime.
Open game/index.html directly in a browser for the best experience on a phone.
"""

from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

GAME = Path(__file__).parent / "game" / "index.html"

st.set_page_config(page_title="Age of Ashlands", page_icon="🏰", layout="wide")

st.markdown(
    """
    <style>
      #MainMenu, footer, header {visibility: hidden;}
      .block-container {padding: 0 !important; max-width: 100% !important;}
      iframe {border: 0;}
    </style>
    """,
    unsafe_allow_html=True,
)

if not GAME.exists():
    st.error(f"Game file not found at {GAME}")
else:
    components.html(GAME.read_text(encoding="utf-8"), height=860, scrolling=False)
