/**
 * 
 * @param {Promise<any>} promised 
 */
const APIParser = async (promised)=>{
    let result = {
        error: null,
        data: null,
    }
    await Promise.resolve(promised)
    .then(res=>{
        result.data = res.data;
    })
    .catch(err=>{
        result.error = {
            message: err?.response?.data?.message || err?.message || "Unknown Error occured",
            error: err?.response?.data?.error || err?.response?.data || {},
        }
    })
    return result;
}
export default APIParser;