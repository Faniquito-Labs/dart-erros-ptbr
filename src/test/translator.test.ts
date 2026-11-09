import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Dictionary, Translator } from '../translator';

const root = join(__dirname, '..', '..');
const dictionary: Dictionary = JSON.parse(readFileSync(join(root, 'out', 'dictionary.json'), 'utf8'));
const translator = new Translator(dictionary);
const fixtures: { code: string; message: string }[] = JSON.parse(
  readFileSync(join(root, 'test-fixtures', 'real-diagnostics.json'), 'utf8'),
);

test('todos os diagnósticos reais do fixture são traduzidos', () => {
  const missing = fixtures.filter((f) => !translator.translate(f.message, f.code).translated);
  assert.deepEqual(missing, []);
});

test('preenche os placeholders com os valores da mensagem original', () => {
  const t = translator.translate(
    "A value of type 'String' can't be assigned to a variable of type 'int'.\nTry changing the type of the variable, or casting the right-hand type to 'int'.",
    'invalid_assignment',
  );
  assert.ok(t.translated);
  assert.match(t.problem, /'String'/);
  assert.match(t.problem, /'int'/);
  assert.match(t.correction, /'int'/);
  assert.doesNotMatch(t.problem + t.correction, /\{\d\}/);
});

test('traduz sem o código do diagnóstico, buscando em todos os modelos', () => {
  const t = translator.translate("Undefined name 'foo'.\nTry correcting the name to one that is defined, or defining the name.");
  assert.ok(t.translated);
  assert.match(t.problem, /'foo'/);
});

test('aceita placeholder vazio no fim da mensagem', () => {
  const t = translator.translate(
    "The argument type 'String' can't be assigned to the parameter type 'int'. ",
    'argument_type_not_assignable',
  );
  assert.ok(t.translated);
  assert.doesNotMatch(t.problem, /\s$/);
});

test('mantém a correção original quando ela não bate com o modelo', () => {
  const t = translator.translate("Undefined name 'foo'.\nAlguma correção nova do SDK.", 'undefined_identifier');
  assert.ok(t.translated);
  assert.equal(t.correction, 'Alguma correção nova do SDK.');
});

test('devolve a mensagem original quando não há tradução', () => {
  const t = translator.translate('Mensagem que não existe no analisador.\nCorreção.', 'codigo_inexistente');
  assert.equal(t.translated, false);
  assert.equal(t.problem, 'Mensagem que não existe no analisador.');
  assert.equal(t.correction, 'Correção.');
});

test('traduz palavras do analisador que entram em placeholders marcados', () => {
  const t = translator.translate(
    "Statements in an if should be enclosed in a block.\nTry wrapping the statement in a block.",
    'curly_braces_in_flow_control_structures',
  );
  assert.equal(t.problem, "As instruções de um 'if' devem ficar entre chaves, em um bloco.");
});

test('traduz o tipo de elemento sem mexer no nome', () => {
  const t = translator.translate(
    "The class 'Mapa' is declared with 2 type parameters, but 1 type arguments are given.\nTry adjusting the number of type arguments.",
    'wrong_number_of_type_arguments_element',
  );
  assert.equal(t.problem, "'Mapa' (classe) declara 2 parâmetro(s) de tipo, mas recebeu 1 argumento(s) de tipo.");
});

test('não traduz identificadores que coincidem com palavras do mapa', () => {
  const t = translator.translate("Undefined name 'method'.", 'undefined_identifier');
  assert.match(t.problem, /'method'/);
});

test('não capitaliza identificadores no início da frase', () => {
  const t = translator.translate("foo isn't a type.\nTry correcting the name to match an existing type.", 'not_a_type');
  assert.ok(t.translated);
  assert.ok(t.problem.startsWith('foo'));
});
