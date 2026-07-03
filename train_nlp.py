import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import pickle
import os

data = pd.read_csv("intents.csv")

X = data["text"]
y = data["intent"]

vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True)
X_vec = vectorizer.fit_transform(X)

model = LogisticRegression(max_iter=1000, random_state=42)
model.fit(X_vec, y)

os.makedirs("models", exist_ok=True)

pickle.dump(model, open("models/intent_model.pkl", "wb"))
pickle.dump(vectorizer, open("models/vectorizer.pkl", "wb"))

print("NLP model trained and saved successfully")

