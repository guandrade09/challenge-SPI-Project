import { Router } from 'express';
import { create, list, getById, updateById, deleteById } from '../controllers/funcionario.controller.js';

const router = Router();

router.post('/funcionarios', create);
router.get('/funcionarios', list);
router.get('/funcionarios/:id', getById);
router.put('/funcionarios/:id', updateById);
router.delete('/funcionarios/:id', deleteById);

export default router;
