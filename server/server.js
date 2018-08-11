import express from "express";
import React from "react";
import { renderToString } from "react-dom/server";
import App from "../common/App";

const app = express();

app.get("/api", (req, res) => {
    res.send({ message: "I am a server route and can also be hot reloaded!" });
});

app.get("*", (req, res) => {

    let application = renderToString(<App />);

    let html = `<!doctype html>
    <html class="no-js" lang="">
        <head>
            <meta charset="utf-8">
            <meta http-equiv="x-ua-compatible" content="ie=edge">
            <title>HMR all the things!</title>
            <meta name="description" content="">
            <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
            <div id="root">${application}</div>
            <script src="http://localhost:3001/client.js"></script>
            <!--Google Maps-->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
            <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCMJEvhE4zXJVu12UmARUJ02Qu3fhhTLe0"></script>
            <script async defer src="https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js"></script>
        </body>
    </html>`;

    res.send(html);
    
});

export default app;