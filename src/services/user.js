import APIParser from "./api_parser"
import http from "./axios"

export const generateToken = async (data) => {
    // return await APIParser(http.post("/api/transaction/", data));
    return await APIParser(http.get(`/payIn?code=${data?.code}&merchant_order_id=${data?.merchant_order_id}&user_id=${data?.user_id}`, data));

}

export const validateToken = async (token) => {
    // return await APIParser(http.post(`/api/transaction/validate/${token}`));
    return await APIParser(http.get(`/validate-payIn-url/${token}`));

}

export const assignBankToPayInUrl = async (token, data) => {
    return await APIParser(http.post(`/assign-bank/${token}`, data));

}
export const expireUrl = async (token) => {
    return await APIParser(http.get(`/expire-payIn-url/${token}`));

}

export const checkPaymentStatus = async (token) => {
    return await APIParser(http.get(`/check-payment-status/${token}`));

}

// to submit img
export const imageSubmit = async (token, data, amount) => {
    console.log("🚀 ~ imageSubmit ~ data:", data)
    console.log("🚀 ~ imageSubmit ~ amount:", amount)


    const res = await APIParser(http.post(`/upload/${token}?amount=${amount}`, data));
    return res
}


export const processTransaction = async (token, data) => {
    return await APIParser(http.post(`/process/${token}`, data));
}