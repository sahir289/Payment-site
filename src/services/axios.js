import axios from "axios";
// const BASE_URL = "http://localhost:9000";
const BASE_URL = "http://localhost:8080/a2x/v1";

const http = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
})

export default http;