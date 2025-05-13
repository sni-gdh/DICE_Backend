import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import {rateLimit} from "express-rate-limit";
import {createServer} from "http"
import requestIp from "request-ip"
import {Server} from "socket.io"
import morganMiddleware from "./logger/morgan.logger.js"
import {initializeSocketIO} from "./scoket/index.js"
import { ApiError } from "./utils/ApiError.js";

const app = express()

const httpServer = createServer(app)

const io = new Server(httpServer,{
    pingTimeout : 60000,
    cors:
        {
            origin : process.env.CORS_ORIGIN,
            credentials : true
        },
});

app.set("io",io)

app.use(
    cors({
        origin :
          process.env.CORS_ORIGIN === "*"
          ?"*"
          :process.env.CORS_ORIGIN?.split(","),
        credentials : true,
    })
);

app.use(requestIp.mw());

const limiter = rateLimit({
    windowMs : 15 * 60 * 1000,
    max : 5000,
    standardHeaders: true, //Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        return req.clientIp;
      },
      handler: (_, __, ___, options) => {
        throw new ApiError(
          options.statusCode || 500,
          `There are too many requests. You are only allowed ${
            options.max
          } requests per ${options.windowMs / 60000} minutes`
        );
      },
})



app.use(express.json({limit : '16kb'}))
app.use(express.urlencoded({extended : true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.use(limiter);
app.use(morganMiddleware);

// api routes
import { errorHandler } from "./middleware/error.middleware.js";
import healthcheckRouter from "./routes/healthcheck.routes.js"

// import app routes  for chat.
import userRouter from './routes/user.routes.js';

import channelRouter from './routes/chat-app/channel.routes.js'
import serverRouter from './routes/chat-app/server.routes.js'
import messageRouter from './routes/chat-app/message.routes.js'

// import media routes for social media.
import socialBookmark from "./routes/socialMedia/bookmark.routes.js";
import socialComment from "./routes/socialMedia/comment.routes.js";
import socialFollow from "./routes/socialMedia/follow.routes.js";
import socialLike from "./routes/socialMedia/like.routes.js";
import socialPost from "./routes/socialMedia/post.routes.js";
import socialProfile from "./routes/socialMedia/profile.routes.js";

// import kitchenSink 
import cookieRouter from './routes/kitchen-sink/cookie.routes.js'
import httpmethodRouter from "./routes/kitchen-sink/httpmethod.routes.js"
import imageRouter from './routes/kitchen-sink/image.routes.js'
import redirectRouter from './routes/kitchen-sink/redirect.routes.js'
import requestinspectionRouter from './routes/kitchen-sink/requestinspection.routes.js'
import responseinspectionRouter from './routes/kitchen-sink/responseinspection.routes.js'
import statuscodeRouter from './routes/kitchen-sink/statuscode.routes.js'

//healthcheck 
app.use("/api/v1/healthcheck", healthcheckRouter);

// app api routes declaration 
app.use("/api/v1/users",userRouter)

app.use("/api/v1/chat/server",serverRouter)
app.use("/api/v1/chat/server/channel",channelRouter)
app.use("/api/v1/chat/server/channel/messages", messageRouter)
// social-app routes declaration.
app.use("/api/v1/social-media/profile",socialProfile );
app.use("/api/v1/social-media/follow",socialFollow );
app.use("/api/v1/social-media/posts", socialPost);
app.use("/api/v1/social-media/like", socialLike);
app.use("/api/v1/social-media/bookmarks", socialBookmark);
app.use("/api/v1/social-media/comments", socialComment);

// * Kitchen sink apis
app.use("/api/v1/kitchen-sink/http-methods", httpmethodRouter);
app.use("/api/v1/kitchen-sink/status-codes", statuscodeRouter);
app.use("/api/v1/kitchen-sink/request", requestinspectionRouter);
app.use("/api/v1/kitchen-sink/response", responseinspectionRouter);
app.use("/api/v1/kitchen-sink/cookies", cookieRouter);
app.use("/api/v1/kitchen-sink/redirect", redirectRouter);
app.use("/api/v1/kitchen-sink/image", imageRouter);

// todo : have see for seeding 

initializeSocketIO(io);
// 

// common error handling middleware
app.use(errorHandler);


export { httpServer }

