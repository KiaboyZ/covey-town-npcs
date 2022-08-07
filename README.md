# See these changes live:
https://comforting-gelato-f08523.netlify.app/
https://covey-ai-backend.herokuapp.com/


# NPCs
How do I upload an NPC using a JSON
Format=
[ { npcObj }, … ]


npcObj = {
![firefox_k6yYCA9e9i](https://user-images.githubusercontent.com/17802256/165201652-c5509203-e00e-44c4-841a-7f8edd473e69.png)
}

Direction = 'front'|'back'|'left'|'right'

startLocation, currentLocation = {
 x: number,
  y: number,
  rotation: Direction,
  moving: boolean,
}

Behavior {
 
  name: string;

  script: Script;

  path: Path;
}

Use this to create a atlas, https://www.codeandweb.com/texturepacker/tutorials/how-to-create-sprite-sheets-for-phaser3

spriteImage: an image of {atlas_img}.png encoded in base64
spriteJSON: a stringified version of {atlas_json}.json 
Name: string, and must match a set of images in the spriteJSON as follows:
    Lets say name = misa
misa_back.png
misa_back_walk.000.png
misa_back_walk.001.png
misa_back_walk.002.png
misa_back_walk.003.png
misa_front.png
misa_front_walk.000.png
misa_front_walk.001.png
misa_front_walk.002.png
misa_front_walk.003.png
misa_left.png
misa_left_walk.000.png
misa_left_walk.001.png
misa_left_walk.002.png
misa_left_walk.003.png
misa_right.png
misa_right_walk.000.png
misa_right_walk.001.png
misa_right_walk.002.png
misa_right_walk.003.png




# Covey.Town

Covey.Town provides a virtual meeting space where different groups of people can have simultaneous video calls, allowing participants to drift between different conversations, just like in real life.
Covey.Town was built for Northeastern's [Spring 2021 software engineering course](https://neu-se.github.io/CS4530-CS5500-Spring-2021/), and is designed to be reused across semesters.
You can view our reference deployment of the app at [app.covey.town](https://app.covey.town/) - this is the version that students built on, and our [project showcase](https://neu-se.github.io/CS4530-CS5500-Spring-2021/project-showcase) highlights select projects from Spring 2021.

![Covey.Town Architecture](docs/covey-town-architecture.png)

The figure above depicts the high-level architecture of Covey.Town.
The frontend client (in the `frontend` directory of this repository) uses the [PhaserJS Game Library](https://phaser.io) to create a 2D game interface, using tilemaps and sprites.
The frontend implements video chat using the [Twilio Programmable Video](https://www.twilio.com/docs/video) API, and that aspect of the interface relies heavily on [Twilio's React Starter App](https://github.com/twilio/twilio-video-app-react). Twilio's React Starter App is packaged and reused under the Apache License, 2.0.

A backend service (in the `services/townService` directory) implements the application logic: tracking which "towns" are available to be joined, and the state of each of those towns.

## Running this app locally

Running the application locally entails running both the backend service and a frontend.

### Setting up the backend

To run the backend, you will need a Twilio account. Twilio provides new accounts with $15 of credit, which is more than enough to get started.
To create an account and configure your local environment:

1. Go to [Twilio](https://www.twilio.com/) and create an account. You do not need to provide a credit card to create a trial account.
2. Create an API key and secret (select "API Keys" on the left under "Settings")
3. Create a `.env` file in the `services/townService` directory, setting the values as follows:

| Config Value            | Description                               |
| ----------------------- | ----------------------------------------- |
| `TWILIO_ACCOUNT_SID`    | Visible on your twilio account dashboard. |
| `TWILIO_API_KEY_SID`    | The SID of the new API key you created.   |
| `TWILIO_API_KEY_SECRET` | The secret for the API key you created.   |
| `TWILIO_API_AUTH_TOKEN` | Visible on your twilio account dashboard. |

### Starting the backend

Once your backend is configured, you can start it by running `npm start` in the `services/townService` directory (the first time you run it, you will also need to run `npm install`).
The backend will automatically restart if you change any of the files in the `services/townService/src` directory.

### Configuring the frontend

Create a `.env` file in the `frontend` directory, with the line: `REACT_APP_TOWNS_SERVICE_URL=http://localhost:8081` (if you deploy the towns service to another location, put that location here instead)

### Running the frontend

In the `frontend` directory, run `npm start` (again, you'll need to run `npm install` the very first time). After several moments (or minutes, depending on the speed of your machine), a browser will open with the frontend running locally.
The frontend will automatically re-compile and reload in your browser if you change any files in the `frontend/src` directory.
