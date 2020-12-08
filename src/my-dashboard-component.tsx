/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import { ApiClient } from "admin-bro";
import { Box } from "@admin-bro/design-system";

const api = new ApiClient();

const Dashboard = () => {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    api.getDashboard().then((response) => {
      setData(response.data);
    });
  }, []);

  return (
    <Box variant="grey">
      <Box variant="white">some: {data.some}</Box>
    </Box>
  );
};

export default Dashboard;
