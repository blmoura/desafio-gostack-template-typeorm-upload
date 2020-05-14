// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TrasactionRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TrasactionRepository);

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();
      if (value > total) {
        throw new AppError(
          'Não é possivel criar a transação com saldo invalido',
          400,
        );
      }
    }

    const categoryRepository = getRepository(Category);

    const categoryExistWithTitle = await categoryRepository.findOne({
      where: { title: category },
    });

    let categoryCreate = null;

    if (!categoryExistWithTitle) {
      categoryCreate = categoryRepository.create({ title: category });
      await categoryRepository.save(categoryCreate);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id:
        (categoryExistWithTitle && categoryExistWithTitle.id) ||
        categoryCreate?.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
