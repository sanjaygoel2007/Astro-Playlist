const current = response.data?.data?.dasha?.current;

if (!current) {
  throw new Error("Invalid response from Prokerala API");
}

return {
  success: true,
  source: "api",
  mahadasha: current.mahadasha,
  antardasha: current.antardasha,
  antardasha_end_date: current.antardasha_end_date
};
