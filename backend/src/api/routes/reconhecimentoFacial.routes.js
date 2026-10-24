import { Router } from 'express';
import { create, list, listByFuncionario } from '../controllers/reconhecimentoFacial.controller.js';

const router = Router();

router.post('/reconhecimentos-faciais', create);
router.get('/reconhecimentos-faciais', list);
router.get('/reconhecimentos-faciais/funcionario/:funcionarioId', listByFuncionario);

export default router;
