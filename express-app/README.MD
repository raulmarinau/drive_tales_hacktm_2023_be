# Express server for chat gpt prompts

Install dependecies: npm install

## For running the container:
### Building the image:

```bash
docker build -t express-app_app:latest .
```

### Running the image
It will bind the local machine port to 3000 
```bash
docker run -it -p 8080:3000 express-app_app
```

Currently working on making the docker-compose run.
