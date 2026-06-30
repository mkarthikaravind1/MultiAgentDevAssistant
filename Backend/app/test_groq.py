import os
from dotenv import load_dotenv
load_dotenv()
key = os.getenv("GROQ_API_KEY")
print("Loaded:", repr(key))

from groq import Groq
client = Groq(api_key=key)
resp = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": "say hi"}],
)
print(resp.choices[0].message.content)