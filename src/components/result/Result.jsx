import React from 'react'
import { Result as ResultAntd } from 'antd';

const Result = ({ status, message }) => {
  return (
    <ResultAntd
      status={status}
      title={status}
      subTitle={message}
    // extra={<Button type="primary">Back Home</Button>}
    />
  )
}

export default Result;