import { config } from 'dotenv';
import { initServer } from './configs/server.js'
import {createAdmin}from './configs/defaultAdmin.js'

config();
initServer();
createAdmin();
