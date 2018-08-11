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
            <meta name="description" content="">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
            <style>
            @import url("https://fonts.googleapis.com/css?family=Open+Sans:400,600,700");
            @import url("https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css");
            *,
  *:before,
  *:after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
            #google-container {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0px;
            left: 0px;
            }
            h1 {
                padding: 50px 0;
                font-weight: 400;
                text-align: center;
              }
              p {
                margin: 0 0 20px;
                line-height: 1.5;
              }
              section {
                display: none;
                padding: 10px 0 0;
                border-top: 1px solid #ddd;
              }
            main {
            min-width: 320px;
            max-width: 300px;
            margin: 0 auto;
            padding-bottom: 0.5rem;
            background: #fff;
            }
            input {
            display: none;
            }
            label {
            display: inline-block;
            margin: 0 0 -1px;
            padding: 15px 25px;
            font-weight: 600;
            text-align: center;
            color: #bbb;
            border: 1px solid transparent;
            }
            label:before {
            font-family: fontawesome;
            font-weight: normal;
            margin-right: 10px;
            }
            label:hover {
            color: #888;
            cursor: pointer;
            }
            input:checked + label {
            color: #555;
            border: 1px solid #ddd;
            border-top: 2px solid red;
            border-bottom: 1px solid #fff;
            }
            #trip-tab1:checked ~ #trip-content1,
            #trip-tab2:checked ~ #trip-content2,
            #trip-tab3:checked ~ #trip-content3,
            #trip-tab4:checked ~ #trip-content4 {
            display: block;
            }
            @media screen and (max-width: 650px) {
            label:before {
                margin: 0;
                font-size: 18px;
            }
            }
            @media screen and (max-width: 400px) {
            label {
                padding: 15px;
            }
            }
            table {
            margin-top: -10px;
            margin-bottom: -5px;
            }
            .vehicleeventvalues {
            font-family: "Trebuchet MS", Arial, Helvetica, sans-serif;
            border-collapse: collapse;
            width: 100%;
            }
            .vehicleeventvalues td,
            #customers th {
            border: 1px solid #ddd;
            padding: 10px;
            }
            .vehicleeventvalues tr:nth-child(even) {
            background-color: #f2f2f2;
            }
            .vehicleeventvalues tr:hover {
            background-color: #ddd;
            }
            .vehicleeventvalues th {
            padding-top: 12px;
            padding-bottom: 12px;
            text-align: left;
            background-color: #4caf50;
            color: white;
            }
            .scroll {
            height: 100%;
            }
            #map {
            width: 100%;
            height: 80%;
            -webkit-box-shadow: 0 7px 9px -8px rgba(0, 0, 0, 0.3);
            box-shadow: 0 7px 9px -8px rgba(0, 0, 0, 0.3);
            }
            [href^="http://maps.google.com/maps"] {
            display: none !important;
            }
            a[href^="https://maps.google.com/maps"] {
            display: none !important;
            }
            .scroll-content {
            background-color: #f4f4f7 !important;
            }
            .gm-style .gm-style-iw {
            top: 17px !important;
            left: 25px !important;
            }
            .scroll-content {
            background-color: #f4f4f7 !important;
            }
            .item-inner {
            border-bottom: 0px !important;
            }
            .icon-img {
            background-color: #fff;
            width: 20px;
            float: left;
            margin-right: 5px;
            }
            .red-text {
            color: red !important;
            text-align: center !important;
            }

            .icon-img {
            background-color: #fff;
            width: 1.6em;
            margin: 0.7rem;
            }

            address{
                color: red
            }
            </style>
            <!--Google Maps-->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.21/moment-timezone.min.js"></script>
            <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCMJEvhE4zXJVu12UmARUJ02Qu3fhhTLe0"></script>
            <script async defer src="https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js"></script>
        </head>
        <body>
            <div id="root">${application}</div>
            <script src="http://localhost:3001/client.js"></script>
        </body>
    </html>`;

  res.send(html);
});

export default app;
