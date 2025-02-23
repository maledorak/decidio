# decidio - a decision-making training tool

Simulate critical scenarios. Make impactful decisions. Handle the consequences.

For now we are supporting following scenarios:

- **Nuclear Crisis** - Lead the nation through an imminent nuclear threat. Every second counts.
- **Black Monday** - Navigate a devastating market crash. Make decisions to stabilize the economy.
- **Emergency Call Center** - Manage critical emergency calls. Coordinate response teams effectively.
- **Custom Scenario** - Create your own scenario. Define the rules and make impactful decisions. (Work in progress...)

## Install and run the app

First, run the development server:

```bash
npm install
```

Create a `.env` file in the root directory and add the following environment variables:

```bash
ELEVENLABS_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

Run **decidio** dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the **decidio** development server.
