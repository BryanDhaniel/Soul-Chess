## SOULCHESS

## Getting Started

### Local
1. First, install the project dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
# or
bun install
```

2. Second, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Docker
> Note that if you are on Linux make sure your system has either [Docker Desktop](https://docs.docker.com/desktop/setup/install/linux/) or [Docker Engine](https://docs.docker.com/engine/) with [Docker Buildx](https://github.com/docker/buildx#linux-packages) installed, if not please choose either option and install them using your chosen package manager.

Run the command below to start the Docker container:

```bash
sudo docker compose up
```

Or if you want it running in the background:

```bash
sudo docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) on your browser to see the site.

To stop the containers (if running in the background): 

```bash
sudo docker compose down
```

To rebuild the containers after making changes to the [Dockerfile](./Dockerfile) or [compose.yaml](./compose.yaml):

```bash
sudo docker compose down
```


## How To Play
