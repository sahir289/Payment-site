import { Button, message } from 'antd';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services';
import ModelPopUp from '../../components/modelPopup/ModelPopUp';

const Home = () => {

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerateUuid = async () => {
    setLoading(true);

    const res = await userAPI.generateToken({
      code: "test_45",
      merchant_order_id: "Hs-9Jq10040663382596042",
      user_id: "zac-12"
    });
    setLoading(false);
    if (res.error) {
      message.error(res.error.error.message);
      return;
    }
    const paymentUrl = res?.data?.data?.payInUrl; // Adjust based on your API response structure
    window.location.href = paymentUrl;
  }

  return (
    <div>
      <p>Welcome!</p>
      <Button
        type='primary'
        loading={loading}
        onClick={handleGenerateUuid}
      >
        Proceed
      </Button>

      {/* <ModelPopUp/> */}
    </div>
  )
}

export default Home;