<?php

namespace App\Support;

/**
 * Helpers portados de internal/handlers/theory.go (simplifyMath, stripMarkdown, ...).
 */
class TextHelper
{
    public static function simplifyMath(string $s): string
    {
        $s = preg_replace('/\\\\sqrt\[([^\]]+)\]\{([^}]+)\}/', 'sqrt($2,$1)', $s);
        $s = preg_replace('/\\\\sqrt\{([^}]+)\}/', 'sqrt($1)', $s);
        $s = preg_replace('/\\\\boxed\{([^}]+)\}/', '$1', $s);
        $s = preg_replace('/\\\\frac\{([^}]+)\}\{([^}]+)\}/', '$1/$2', $s);
        $s = preg_replace('/\\\\text\{([^}]+)\}/', '$1', $s);
        $replacements = [
            '\\\\neg' => '~', '\\\\land' => '&', '\\\\lor' => 'v',
            '\\\\ge' => '>=', '\\\\le' => '<=', '\\\\times' => 'x',
            '\\\\div' => '/', '\\\\cdot' => '.', '\\\\sum' => 'sum',
            '\\\\to' => '->', '\\\\rightarrow' => '->', '\\\\Rightarrow' => '=>',
            '\\\\approx' => '~=', '\\\\neq' => '!=',
        ];
        foreach ($replacements as $pattern => $replacement) {
            $s = preg_replace('/'.$pattern.'/', $replacement, $s);
        }
        $s = str_replace('\\pm', '+/-', $s);
        $s = preg_replace('/\$\$(.+?)\$\$/s', '$1', $s);
        $s = preg_replace('/\$([^$]+?)\$/', '$1', $s);

        return $s;
    }

    public static function stripMarkdown(string $s): string
    {
        $s = self::simplifyMath($s);
        $s = str_replace(['**', '__', '`'], '', $s);
        $s = preg_replace('/\[([^\]]+)\]\([^)]+\)/', '$1', $s);
        $s = preg_replace('/\*(.+?)\*/s', '$1', $s);
        $s = preg_replace('/_(.+?)_/s', '$1', $s);

        return trim($s);
    }

    public static function titleCase(string $s): string
    {
        return mb_convert_case($s, MB_CASE_TITLE, 'UTF-8');
    }

    public static function cleanFileName(string $filename): string
    {
        $name = preg_replace('/\.md$/', '', $filename);
        $name = ltrim($name, '0123456789-');
        $name = str_replace(['-', '_'], ' ', $name);

        return self::titleCase($name);
    }

    public static function normalizeForMatch(string $s): string
    {
        $s = mb_strtolower(trim(self::transliterate($s)));
        $words = preg_split('/\s+/', $s);
        $skip = ['de' => 1, 'da' => 1, 'do' => 1, 'e' => 1, 'em' => 1, 'para' => 1, 'com' => 1, 'um' => 1, 'uma' => 1, 'os' => 1, 'as' => 1, 'no' => 1, 'na' => 1, 'dos' => 1, 'das' => 1, 'a' => 1, 'o' => 1];
        $filtered = array_values(array_filter($words, fn ($w) => ! isset($skip[$w])));

        return implode(' ', $filtered);
    }

    public static function transliterate(string $s): string
    {
        $map = [
            'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'é' => 'e', 'ê' => 'e',
            'í' => 'i', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ú' => 'u', 'ü' => 'u', 'ç' => 'c',
            'Á' => 'A', 'À' => 'A', 'Â' => 'A', 'Ã' => 'A', 'É' => 'E', 'Ê' => 'E',
            'Í' => 'I', 'Ó' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ú' => 'U', 'Ü' => 'U', 'Ç' => 'C',
        ];

        return strtr($s, $map);
    }

    /**
     * Normaliza palavras para o auto-link edital <-> teoria.
     *
     * @return array<string, true>
     */
    public static function normalizeWords(string $s): array
    {
        $s = mb_strtolower(trim(strtr($s, [
            '(' => '', ')' => '', '-' => ' ',
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'ã' => 'a', 'õ' => 'o', 'â' => 'a', 'ê' => 'e', 'ô' => 'o', 'ç' => 'c',
            'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U',
            'Ã' => 'A', 'Õ' => 'O', 'Â' => 'A', 'Ê' => 'E', 'Ô' => 'O', 'Ç' => 'C',
        ])));

        $abbrExpand = ['ia' => 'inteligencia artificial', 'bi' => 'business intelligence', 'ti' => 'tecnologia informacao'];
        foreach ($abbrExpand as $abbr => $full) {
            $s = str_replace($abbr, ' '.$full.' ', $s);
        }

        $set = [];
        foreach (preg_split('/\s+/', $s) as $w) {
            if (mb_strlen($w) > 2 || $w === 'bi' || $w === 'ti') {
                $set[$w] = true;
            }
        }

        return $set;
    }
}
