import { Schema, model } from "mongoose";

type User = {
    avatarUrl: string,
    tag: string,
    balance: number,
    gnStreaks: number,
    gmStreaks: number,
    callTimes: number[]
}

const userSchema = new Schema({
    avatarURL: { type: String, required: true },
    tag: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 },
    gnStreaks: { type: Number, required: true, default: 0 },
    gmStreaks: { type: Number, required: true, default: 0 },
    callTimes: { type: Array(Number), required: true, default: [] },
})

const serverSchema = new Schema({
    prefix: { type: String, required: true, default: "!" },
    guildID: { type: String, required: true },
    members: { type: Array(userSchema), required: true, default: [] }
})


/*
const mongoose = require('mongoose');

const CallTimeScheme = new mongoose.Schema({
  scores: {
    type: Array,
    default: []
  },
  joinTime: {
    type: Date || null
  },
  highscore: {
    type: Number
  },
  lowscore: {
    type: Number
  },
  ping: {
    type: Boolean,
    default: true
  }
}, {_id : false});

const StreakScheme = new mongoose.Schema({
  gnStreak: {
    type: Number,
    required: true,
    default: 0
  },
  gmStreak: {
    type: Number,
    required: true,
    default: 0
  },
  gnTime: {
    type: Date
  },
  gmTime: {
    type: Date
  },
  gnHighscore: {
    type: Number,
    required: true,
    default: 0
  },
  gmHighscore: {
    type: Number,
    required: true,
    default: 0
  }
}, {_id : false});

const MarriageScheme = new mongoose.Schema({
  marriages: {
    type: Array,
    required: true,
    default: []
  },
  marriageInbox: {
    type: Array,
    required: true,
    default: []
  }
}, {_id : false});

const CallTime = mongoose.model('CallTime', CallTimeScheme);
const Streak = mongoose.model('Streak', StreakScheme);
const Marriage = mongoose.model('Marriage', MarriageScheme);

const UserConfigScheme = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  userID: {
    type: String,
    required: true,
    unique: true
  },
  avatar: {
    type: String,
    required: true
  },
  callTimes: {
    type: CallTimeScheme,
    default: new CallTime()
  },
  streaks: {
    type: StreakScheme,
    default: new Streak()
  },
  marriage: {
    type: MarriageScheme,
    default: new Marriage()
  }
});

module.exports = mongoose.model('UserConfig', UserConfigScheme);
*/

export const User = model('User', userSchema);
export const Server = model('Server', serverSchema);