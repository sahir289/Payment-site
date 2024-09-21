import React, { useEffect, useState } from "react";
import { Spin, Tabs, Modal, Form, Input, Button, message } from "antd";
import { FcRating } from "react-icons/fc";
import { Upi, Bank, Result } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { userAPI } from "../../services";
import "./transactions.css";
import ModelPopUp from "../../components/modelPopup/ModelPopUp";
import WebSockets from "../../components/webSockets/WebSockets";
import { ErrorImg } from "../../utils/constants";
import { payInExpireURL } from "../../services/user";

const Transactions = () => {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState("0.0");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionsInformation, setTransactionInformation] = useState(null);
  const [status, setStatus] = useState(null);
  const [timer, setTimer] = useState(10 * 60);
  const [expireTime, setExpireTime] = useState(10000000000);
  const [paymentModel, setPaymentModel] = useState(false);
  const [modelData, setModelData] = useState({});
  const [fileData, setFileData] = useState(null);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    handleExpireURL(params.token);
  }, [params.token])

  const handleExpireURL = async (token) => {
    const validateRes = await userAPI.validateToken(token);
    if (validateRes.data?.data?.one_time_used) {
      setStatus({
        status: "403",
        message: "The Link has been expired!",
      });
      return;
    }
    const expireRes = await payInExpireURL(token)

  }
  const expireUrlHandler = async () => {
    const token = params.token;
    const validateRes = await userAPI.validateToken(token);
    const expiryRes = await userAPI.expireUrl(token);
  };

  const checkPaymentStatusHandler = async () => {
    const token = params.token;
    const res = await userAPI.checkPaymentStatus(token);
    if (res?.data?.data?.status === "Success") {
      setPaymentModel(true);
      setModelData(res?.data?.data);
    } else if (res?.data?.data?.status === "DISPUTE") {
      setPaymentModel(true);
      setModelData(res?.data?.data);
    } else if (res?.error?.error?.status === 400) {
      setInterval(() => {
        setStatus({
          status: "400",
          message: "Url is Already expired!",
        });
      }, 10000);
    }
  };

  useEffect(() => {
    if (timer <= 0) {
      setStatus({
        status: "403",
        message: "The Link has been expired!",
      });
      expireUrlHandler();
      return;
    }
    const timerID = setTimeout(() => tick(), 1000);

    return () => clearTimeout(timerID);
  }, [timer]);

  useEffect(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > expireTime) {
      expireUrlHandler();
    }
  }, [timer]);

  useEffect(() => {
    handleValidateToken();
  }, [params.token]);

  const handleValidateToken = async () => {
    const token = params.token;
    setLoading(true);
    const res = await userAPI.validateToken(token);
    setLoading(false);
    if (res.error) {
      setStatus({
        status: res.error?.error?.status || "error",
        message: res.error.message,
      });
      return;
    }
    const data = res.data.data;
    if (data?.expiryTime) {
      const difference =
        new Date(data.expiryTime * 1000).getTime() - new Date().getTime();
      const seconds = Math.floor(difference / 1000);
      if (seconds > 0) {
        setTimer(seconds);
      }
    }
    setExpireTime(data?.expiryTime);
    setIsModalOpen(true);
  };

  const handleUtrNumber = async (data) => {
    const updateData = {
      usrSubmittedUtr: data?.utrNumber,
      code: transactionsInformation?.code,
      amount,
    };
    setProcessing(true);
    const res = await userAPI.processTransaction(params.token, {
      ...updateData,
    });
    setProcessing(false);
    if (res?.data?.data) {
      setPaymentModel(true);
      setModelData(res?.data?.data);
    }
  };

  const handleAmount = (data) => {
    const token = params.token;
    setIsModalOpen(false);
    setAmount(data.amount);
    const amount = data;
    const bankAssignRes = userAPI
      .assignBankToPayInUrl(token, amount)
      .then((res) => {
        setTransactionInformation(res?.data?.data || null);
        if (res.error?.error?.status === 404) {
          setStatus({
            status: "404",
            message: "Bank is not linked with the merchant!",
          });
          expireUrlHandler();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  function tick() {
    setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
  }

  const formatTime = (time) => {
    const minutes = String(Math.floor(time / 60)).padStart(2, "0");
    const seconds = String(time % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    setFileData(file);
  };

  const handleImgSubmit = async () => {
    const token = params.token;
    if (fileData !== undefined || fileData !== null) {
      const formData = new FormData();
      formData.append("file", fileData);
      const amountData = amount;
      setProcessing(true);
      const imgSubmitRes = await userAPI
        .imageSubmit(token, formData, amount)
        .then((res) => {
          setPaymentModel(true);
          setModelData(res?.data?.data);
        })
        .catch((err) => {
          console.log(err);
        });
      setProcessing(false);
    }
  };

  const formattedTime = formatTime(timer);

  return (
    <>
      <WebSockets checkPaymentStatusHandler={checkPaymentStatusHandler} />

      {loading ? (
        <Spin />
      ) : (
        <>
          {status !== null ? (
            <>
              <ErrorImg />
              <div className="font-serif text-2xl bg-blue-400 p-6 font-semibold rounded-lg mt-2">
                <p className="">Status : {status?.status}</p>
                <p>Message: {status?.message}</p>
              </div>
            </>
          ) : (
            <>
              <div className="main-section">
                {paymentModel === true && (
                  <ModelPopUp
                    paymentModel={paymentModel}
                    modelData={modelData}
                    redirected={redirected}
                    setRedirected={setRedirected}
                  />
                )}
                <header>
                  <div className="icon">
                    <FcRating size={30} />
                    <p>Trust Pay</p>
                  </div>
                </header>
                <div className="main-content">
                  <Tabs
                    defaultActiveKey="1"
                    className="tabs"
                    type="card"
                    tabBarGutter={5}
                    style={{ marginTop: "-10px" }}
                  >
                    <Tabs.TabPane tab="UPI" key="1">
                      <Upi
                        {...transactionsInformation}
                        amount={amount}
                        formattedTime={formattedTime}
                      />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Bank Transfer" key="3">
                      <Bank
                        {...transactionsInformation}
                        amount={amount}
                        formattedTime={formattedTime}
                      />
                    </Tabs.TabPane>
                  </Tabs>

                  <Tabs defaultActiveKey="1" className="bottom-tabs" type="card">
                    <Tabs.TabPane tab="Enter UTR" key="1">
                      <Form
                        layout="vertical"
                        onFinish={handleUtrNumber}
                        style={{ marginTop: "-24px" }}
                      >
                        <div className="utr-number pt-[30px]">
                          <Form.Item
                            label={
                              <span>
                                Enter UTR Number
                                <span
                                  className="text-red-500"
                                  style={{ marginLeft: 8 }}
                                >
                                  (* UTR can be submitted only once)
                                </span>
                              </span>
                            }
                            name="utrNumber"
                            rules={[
                              {
                                required: true,
                                message: "Please enter UTR no",
                              },
                              {
                                pattern: /^\d{12}$/,
                                message: "UTR number must be exactly 12 digits",
                              },
                            ]}
                          >
                            <Input type="text" size="middle" />
                          </Form.Item>
                          <Form.Item name="" label=" ">
                            <Button
                              type="primary"
                              size="middle"
                              htmlType="submit"
                              loading={processing}
                              className="ml-1"
                            >
                              Submit
                            </Button>
                          </Form.Item>
                        </div>
                      </Form>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Upload ScreenShot" key="2">
                      <Form
                        layout="vertical"
                        onFinish={handleImgSubmit}
                        className="m-0 p-0"
                      >
                        <Form.Item
                          label={<span className="">Add the Image here</span>}
                          className=" ps-6 w-full"
                          style={{ backgroundColor: "#f7f7f7" }}
                        >
                          <div className="flex justify-between w-full">
                            <input
                              accept="image/*"
                              // multiple=""
                              className="w-full h-10"
                              type="file"
                              // ref={fileInputRef}
                              onChange={handleFileChange}
                            />
                            <Button
                              type="primary"
                              size="middle"
                              htmlType="submit"
                              loading={processing}
                              className="pe-5 mr-2 w-[132px]"
                            >
                              Submit
                            </Button>
                          </div>
                        </Form.Item>
                      </Form>
                    </Tabs.TabPane>
                  </Tabs>
                </div>
                <Modal title="Attention" open={isModalOpen} footer={false}>
                  <Form layout="vertical" onFinish={handleAmount}>
                    <div>
                      <Form.Item
                        name="amount"
                        label="Please enter the amount for this transaction"
                        rules={[
                          { required: true, message: "Please enter amount" },
                        ]}
                      >
                        <Input
                          type="number"
                          placeholder="Enter New Amount"
                          size="large"
                          addonAfter="₹"
                          min={1}
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') {
                              e.preventDefault();
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (value <= 0) {
                              e.target.value = "";
                            }
                          }} 
                        />
                      </Form.Item>
                      <Button type="primary" htmlType="submit">
                        Submit
                      </Button>
                    </div>
                  </Form>
                </Modal>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default Transactions;
