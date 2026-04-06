export interface MathProblem {
  num1: number;
  num2: number;
  operator: '+' | '-' | 'x';
  answer: number;
  display: string;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Level 1: Counting (identify number)
// Level 2: Addition to 10
// Level 3: Addition to 20
// Level 4: Subtraction to 10
// Level 5: Subtraction to 20
// Level 6: Mixed add/sub to 20
// Level 7: Multiplication by 2,3,5
// Level 8: Multiplication by 4,6,7
// Level 9: Multiplication by 8,9
// Level 10: Mixed all

export function generateProblem(level: number): MathProblem {
  let num1: number, num2: number, operator: '+' | '-' | 'x', answer: number;

  if (level <= 2) {
    // Addition to 10
    num1 = randInt(1, 5);
    num2 = randInt(1, 5);
    operator = '+';
    answer = num1 + num2;
  } else if (level <= 3) {
    // Addition to 20
    num1 = randInt(5, 12);
    num2 = randInt(1, 8);
    operator = '+';
    answer = num1 + num2;
  } else if (level <= 4) {
    // Subtraction to 10
    num1 = randInt(3, 10);
    num2 = randInt(1, num1 - 1);
    operator = '-';
    answer = num1 - num2;
  } else if (level <= 5) {
    // Subtraction to 20
    num1 = randInt(10, 20);
    num2 = randInt(1, num1 - 1);
    operator = '-';
    answer = num1 - num2;
  } else if (level <= 6) {
    // Mixed add/sub to 20
    if (Math.random() > 0.5) {
      num1 = randInt(5, 12);
      num2 = randInt(1, 8);
      operator = '+';
      answer = num1 + num2;
    } else {
      num1 = randInt(8, 20);
      num2 = randInt(1, num1 - 1);
      operator = '-';
      answer = num1 - num2;
    }
  } else if (level <= 7) {
    // Multiplication by 2, 3, 5
    const tables = [2, 3, 5];
    num1 = tables[randInt(0, tables.length - 1)];
    num2 = randInt(1, 10);
    operator = 'x';
    answer = num1 * num2;
  } else if (level <= 8) {
    // Multiplication by 4, 6, 7
    const tables = [4, 6, 7];
    num1 = tables[randInt(0, tables.length - 1)];
    num2 = randInt(1, 10);
    operator = 'x';
    answer = num1 * num2;
  } else if (level <= 9) {
    // Multiplication by 8, 9
    const tables = [8, 9];
    num1 = tables[randInt(0, tables.length - 1)];
    num2 = randInt(1, 10);
    operator = 'x';
    answer = num1 * num2;
  } else {
    // Mixed all
    const type = randInt(0, 2);
    if (type === 0) {
      num1 = randInt(5, 50);
      num2 = randInt(1, 30);
      operator = '+';
      answer = num1 + num2;
    } else if (type === 1) {
      num1 = randInt(10, 50);
      num2 = randInt(1, num1 - 1);
      operator = '-';
      answer = num1 - num2;
    } else {
      num1 = randInt(2, 12);
      num2 = randInt(2, 12);
      operator = 'x';
      answer = num1 * num2;
    }
  }

  return {
    num1,
    num2,
    operator,
    answer,
    display: `${num1} ${operator} ${num2}`,
  };
}

export function generateChoices(answer: number, count: number = 4): number[] {
  const choices = new Set<number>([answer]);
  while (choices.size < count) {
    const offset = randInt(-5, 5);
    const choice = answer + offset;
    if (choice > 0 && choice !== answer) {
      choices.add(choice);
    }
  }
  return Array.from(choices).sort(() => Math.random() - 0.5);
}
