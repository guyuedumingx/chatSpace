import axios from "axios";

export const API_BASE_URL = "http://localhost:8000/api";
//解决跨域问题
axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*";