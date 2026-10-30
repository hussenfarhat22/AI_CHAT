# AI CHAT
A multi model ai chat application. chat with models with several providers through openrouter, switch models in midd conversation without losing any context , also conversations are saved in browser.

- **live app:** https://ai-chat-green-phi.vercel.app/
- **reposetory:**https://github.com/hussenfarhat22/AI_CHAT

## Features: 

-Chat interface with streaming responses and Markdown / code-block rendering
- Model selector covering several providers ( OpenAI, Anthropic, Google, Meta)
- Mid-conversation model switching, with the full message history passed to the new model
- Conversation management: create, rename, delete and reopen chats
- Each response labeled with the model that produced it
- Responsive UI for desktop and mobile, with light and dark mode
 
## Models used:

- openai/gpt-4o-mini", name: "GPT-4o mini", provider: "OpenAI" 
- anthropic/claude-haiku-5.5", name : " claude-haiku-5.5", provider: "OpenAI"
- google/gemini-3.8-flash", name: "Gemini 3.8 Flash", provider: "Google" 
- meta-llama/llama-3.1-8b-instruct", name: "Llama 3.1 8B", provider: "Meta"

## Tech stack

- Next.js (App Router) and TypeScript
- Tailwind CSS
- Vercel AI SDK (`ai`, `@ai-sdk/react`) with the OpenRouter provider
- `react-markdown` and `remark-gfm`
- Browser localStorage for conversations
- Deployed on Vercel (Hobby plan)


## Getting started

**Requirements:** Node.js 22 or later, npm, and an OpenRouter API key.

```bash
git clone https://github.com/hussenfarhat22/AI_CHAT.git
cd AI_CHAT
npm install
```
create file named `.env.local` in the project root with one line :

OPENROUTER_API_KEY='put your api key here' 
then start the app and open the address it prints ( usually http://localhost:3000/)

npm run dev

## Deployment
1. Import the repository into Vercel.
2. Add `OPENROUTER_API_KEY` under **Settings, Environment Variables**.
3. Deploy. Every push to `main` redeploys automatically.

## Security 

- `OPENROUTER_API_KEY` is read only in `src/app/api/chat/route.ts`, on the server. 
- `.env.local` is ignored by Git.
- The server only accepts model IDs from its own list, so a request can't select an arbitrary model.