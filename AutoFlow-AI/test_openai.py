from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-5.5",
    input="Say exactly: AutoFlow AI connection successful!"
)

print(response.output_text)