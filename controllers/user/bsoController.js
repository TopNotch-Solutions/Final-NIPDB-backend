const BSO = require("../../models/bso");

exports.all = async (req, res) => {
    try {
      const bsos = await BSO.findAll();
      if (bsos) {
        res.status(201).json({
          status: "SUCCESS",
          message: "Bso successfully created!",
          data: bsos,
        });
      } else {
        res.status(500).json({
          status: "FAILURE",
          message: "Internal server error.",
        });
      }
    } catch (error) {
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
      });
    }
  };
  exports.single = async (req, res) => {
    try {
      const id = req.params.id;
  
      if (id === "") {
        res.status(400).json({
          status: "FAILURE",
          message: "Empty parameter",
        });
      } else {
        const bso = await BSO.findOne({
          where: {
            id,
          },
        });
  
        if (bso) {
          res.status(200).json({
            status: "SUCCESS",
            message: "Bsos successfully retrieved!",
            data: bso,
          });
        } else {
          res.status(500).json({
            status: "FAILURE",
            message: "Internal server error.",
          });
        }
      }
    } catch (error) {
      res.status(500).json({
        status: "FAILURE",
        message: "Internal server error: " + error.message,
      });
    }
  };