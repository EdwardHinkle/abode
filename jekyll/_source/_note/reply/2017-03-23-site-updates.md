---
layout: post
date: 2017-03-23 11:00:00 -0500
type: note
title: ""
tags: [tech, indieweb]
duration: 3
in-reply-to: "https://martymcgui.re/2017/03/22/003710/"
reply-title: "Site updates: Displaying Webmentions!"
reply-author: "Marty McGuire"
reply-photo: "https://webmention.io/avatar/martymcgui.re/4f9fac2b9e3ae62998c557418143efe288bca8170a119921a9c6bfeb0a1263a2.jpeg"
reply-site: "https://martymcgui.re/"
reply-context: "I'd like to include a JavaScript enhancement that will show any new mentions, so they aren't sitting in \"limbo\" until I make a new post."
---
This is the conundrum with static sites in the IndieWeb world. How do you enable a live, real-time engaging site when your site is built to be static?

My solution thus far has been to build a node.js app that runs on the same site as my Jekyll server. I’m actually using a lot of node.js to rebuild my site: When my git repo gets a new commit or when I hit a secret URL and soon, when my site receives a micropub request, it causes Jekyll to pull down new code from the repo. Then it runs a local node.js script that fetches recent Goodreads data that gets dumped in my Jekyll /data directory, and Jekyll gets rebuilt with all of the data. The other situation I came across was if I updated Goodreads but nothing else. For that case I decided daily was frequently enough so at 2am my time, my site always rebuilds (again caused by my node.js back engine).