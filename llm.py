import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def generate_response(context, query):
    prompt = f"""You are a highly professional personal banking concierge.
Here is the live data from the user's account: {context}

User Query: {query}

INSTRUCTIONS:
1. Address the user directly by their name.
2. Be extremely concise. Respond in 1 to 2 short sentences maximum.
3. Act like a helpful human assistant over SMS.
4. DO NOT use markdown, bullet points, bold text, or lists. Keep it plain conversational text.
5. Answer their query accurately using the provided account data. If they ask for balance, state it clearly.
6. IMPORTANT: ALWAYS use 'RS' (Pakistani Rupees) for any currency amount. NEVER use the dollar sign ($).
"""
    try:
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
        )
        return completion.choices[0].message.content
    except Exception as e:
        print("LLM Error:", e)
        return "I am currently unable to process your request. Please try again later."
