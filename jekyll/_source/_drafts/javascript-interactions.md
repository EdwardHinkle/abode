---
layout: post
title:  "JavaScript IndieWeb Interactions"
date: 2017-03-09 15:51:54 -0500
type: article
categories: tech
tags: [IndieWeb]
duration: 0
---


Looking into JavaScript frontend and backend integration on site to allow for micropub responses from my site specifically, rather than having to go to their site or a reader. Imagine: clicking "favorite or reply", a pop-up asks for the user's website. Micropub Authentication similar to Quill. Once authenticated, user is brought back to my site with JavaScript-based UI that allows for interacting with the site. All data is funneled through a backend API to prevent CORS error, sent as micropub back to user's origin url. Data is kept as "pending" until a webmention comes through from the user's website. If a webmention doesn't come through within 24 hours, the interaction is deleted.