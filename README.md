# tldr-ai
An AI based chrome extension powered by Gemini AI and TiDB that allows users to ask questions the tabs there are in 

## Inspiration
While Chat-GPT usage is on the rise. The risk of people trying to upload content on open internet is on the rise. This does not mean that employees should refrain from using AI. TL;DR aims to em-power employees with generative AI usage but in controlled environment. To facilitate further, it uses RAG (Retrieval Augmented Generation) technique to allow employees to ask questions against PDF, and other secured documents that 


## Features
- Chat with URL that are secured behind login
- Chat with content by simply selecting text on a webpage
- Chat with specific content on page
- Chat with content that is present across multiple URLs

## Demo & Video
Demo Link: You need to install the chrome extension
Video Link: [Youtube](https://youtu.be/RcvJFfo7D8I)
Blog Post: [Devpost](https://devpost.com/software/plan-it-xrncmp)

## Tech Stack
- TiDB Serverless (with Vector feature)
- React Typescript
- Python Flask

## Pre-requisite
1. TiDB Serverless database credentials
2. Google's Gemini AI, API Key


## Docker Installation

```shell
docker pull godwinpinto/tldr-ai:0.0.1
docker run --name godwinpinto/tldr-ai:0.0.1 -d -p 8080:8080 -e GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY" -e HOST="YOUR_TIDB_HOST" -e PORTS=4000 -e USER="YOUR_TIDB_USER" -e PASSWORD="YOUR_TIDB_PASSWORD" -e DATABASE="TLDR_DB" -e SSL_CA="./isrgrootx1.pem" 
```

## Installation
Add the env file in **backend/.env** and **frontend/.env**. Examples keys are provided

```shell
git clone https://github.com/godwinpinto/tldr-ai.git
cd tldr-ai
cd backend

python3 -m venv venv  # on Windows, use "python -m venv venv" instead
. venv/bin/activate   # on Windows, use "venv\Scripts\activate" instead
pip install -r requirements.txt
flask run

# To build extension
cd ../frontend
pnpm install 
pnpm run dev # To run in browser and test basic sanity
pnpm run start # To build the extension

#Now go to chrome
#go to chrome://extensions
#Enable developer mode
#Load unpacked extension and select the dist folder
# TLDR should be available as an extension
```

## License
The source code is released under MIT license.
