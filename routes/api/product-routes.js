const router = require("express").Router();
const { Product, Category, Tag, ProductTag } = require("../../models");
const { destroy } = require("../../models/Product");

// The `/api/products` endpoint

// get all products
router.get("/", async (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, { model: Tag }],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get("/:id", async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  // console.log(res);
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, { model: Tag }],
    });
    if (!productData) {
      res.status(404).json({ message: "No product found with that id!" });
      return;
    }
    res.status(200).json(productData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// create new product
router.post("/", async (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */

  // if there's product tags, we need to create pairings to bulk create in the ProductTag model
  try {
    const product = await Product.create(req.body);

    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: product.id,
          tag_id,
        };
      });
      const productTagIds = await ProductTag.bulkCreate(productTagIdArr);
      return res.status(200).json(productTagIds);
    }
    // if no product tags, just respond
    return res.status(200).json(product);
  } catch (err) {
    return res.status(400).json({ message: "Category doesnt exist" });
  }
});

// update product
router.put("/:id", async (req, res) => {
  // update product data
  try {
    const product = await Product.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTags = await ProductTag.findAll({
        where: { product_id: req.params.id },
      });
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });

      // figure out which ones to remove
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);
      // run both actions
      await ProductTag.destroy({ where: { id: productTagsToRemove } });
      await ProductTag.bulkCreate(newProductTags);
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(400).json(err);
  }
});

router.delete("/:id", async (req, res) => {
  // delete one product by its `id` value
  try {
    const productDelete = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });
    if (!productDelete) {
      res.status(404).json({ message: "No product found with that id!" });
      return;
    }
    res.status(200).json({ message: "It has been deleted!" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;
