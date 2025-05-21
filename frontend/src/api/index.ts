import axios from "axios";

export const API_BASE_URL = "http://172.20.10.4:8000/api";
// export const API_BASE_URL = "http://localhost:8000/api";
//解决跨域问题
axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*";
axios.defaults.headers.common["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
axios.defaults.headers.common["Access-Control-Allow-Headers"] = "Content-Type, Authorization";