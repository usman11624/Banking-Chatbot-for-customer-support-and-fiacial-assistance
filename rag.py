from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain.document_loaders import TextLoader

# Load data
loader = TextLoader("data.txt")
docs = loader.load()

# Create embeddings
embeddings = OpenAIEmbeddings()

# Create vector DB
db = FAISS.from_documents(docs, embeddings)

def get_answer(query):
    results = db.similarity_search(query, k=1)
    return results[0].page_content